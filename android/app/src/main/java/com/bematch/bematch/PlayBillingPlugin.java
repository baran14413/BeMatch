package com.bematch.bematch;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.AcknowledgePurchaseParams;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "PlayBilling";
    private BillingClient billingClient;
    private PluginCall pendingCall;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases()
                .build();
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        String basePlanId = call.getString("basePlanId");

        if (productId == null || productId.isEmpty()) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Product ID gerekli");
            call.resolve(result);
            return;
        }

        pendingCall = call;

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    querySubscription(productId, basePlanId);
                } else {
                    resolveError("Billing baglantisi kurulamadi: " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "Billing service disconnected");
            }
        });
    }

    private void querySubscription(String productId, String basePlanId) {
        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build();

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(product);

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(@NonNull BillingResult billingResult,
                    @NonNull List<ProductDetails> productDetailsList) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                        && !productDetailsList.isEmpty()) {
                    launchBillingFlow(productDetailsList.get(0), basePlanId);
                } else {
                    resolveError("Urun bulunamadi (ID: " + productId + "). Hata: "
                            + billingResult.getDebugMessage());
                }
            }
        });
    }

    private void launchBillingFlow(ProductDetails productDetails, String basePlanId) {
        Activity activity = getActivity();
        if (activity == null) {
            resolveError("Activity bulunamadi");
            return;
        }

        List<ProductDetails.SubscriptionOfferDetails> offerDetailsList = productDetails
                .getSubscriptionOfferDetails();
        if (offerDetailsList == null || offerDetailsList.isEmpty()) {
            resolveError("Abonelik teklifi bulunamadi");
            return;
        }

        // Find the matching offer by basePlanId
        String selectedOfferToken = null;
        if (basePlanId != null && !basePlanId.isEmpty()) {
            for (ProductDetails.SubscriptionOfferDetails offer : offerDetailsList) {
                if (offer.getBasePlanId().equals(basePlanId)) {
                    selectedOfferToken = offer.getOfferToken();
                    break;
                }
            }
        }

        // Fallback to first offer if no match found
        if (selectedOfferToken == null) {
            selectedOfferToken = offerDetailsList.get(0).getOfferToken();
        }

        BillingFlowParams.ProductDetailsParams productDetailsParams = BillingFlowParams.ProductDetailsParams
                .newBuilder()
                .setProductDetails(productDetails)
                .setOfferToken(selectedOfferToken)
                .build();

        List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
        productDetailsParamsList.add(productDetailsParams);

        BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();

        billingClient.launchBillingFlow(activity, billingFlowParams);
    }

    private void resolveError(String errorMessage) {
        JSObject result = new JSObject();
        result.put("success", false);
        result.put("error", errorMessage);
        if (pendingCall != null) {
            pendingCall.resolve(result);
            pendingCall = null;
        }
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, List<Purchase> purchases) {
        JSObject result = new JSObject();

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (!purchase.isAcknowledged()) {
                    AcknowledgePurchaseParams ackParams = AcknowledgePurchaseParams.newBuilder()
                            .setPurchaseToken(purchase.getPurchaseToken())
                            .build();
                    billingClient.acknowledgePurchase(ackParams, ackResult -> {
                        Log.d(TAG, "Purchase acknowledged: " + ackResult.getResponseCode());
                    });
                }
                result.put("success", true);
                result.put("purchaseToken", purchase.getPurchaseToken());
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            result.put("success", false);
            result.put("error", "Satin alma iptal edildi");
        } else {
            result.put("success", false);
            result.put("error", "Satin alma hatasi: " + billingResult.getDebugMessage());
        }

        if (pendingCall != null) {
            pendingCall.resolve(result);
            pendingCall = null;
        }
    }
}
